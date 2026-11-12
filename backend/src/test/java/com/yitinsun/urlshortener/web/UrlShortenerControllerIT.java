package com.yitinsun.urlshortener.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yitinsun.urlshortener.domain.UrlMapping;
import com.yitinsun.urlshortener.repo.UrlMappingRepository;
import com.yitinsun.urlshortener.web.dto.ShortenRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UrlShortenerControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UrlMappingRepository repository;

    @BeforeEach
    void clean() {
        repository.deleteAll();
    }

    @Test
    void shortenValidUrlReturns201WithPayload() throws Exception {
        mockMvc.perform(post("/api/v1/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ShortenRequest("https://example.com/system-design", 365))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.longUrl").value("https://example.com/system-design"))
                .andExpect(jsonPath("$.shortUrl").value(startsWith("http://localhost:8080/short/")))
                .andExpect(jsonPath("$.shortCode").value(matchesPattern("[0-9A-Za-z]{5,7}")))
                .andExpect(jsonPath("$.expiresAt").value(not(emptyOrNullString())));
    }

    @Test
    void secondPostOfSameLongUrlReturnsSameShortCode() throws Exception {
        String body = objectMapper.writeValueAsString(new ShortenRequest("https://example.com/same", null));
        MvcResult first = mockMvc.perform(post("/api/v1/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        String firstCode = objectMapper.readTree(first.getResponse().getContentAsString()).get("shortCode").asText();

        mockMvc.perform(post("/api/v1/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shortCode").value(firstCode));
    }

    @Test
    void htmlInLongUrlReturns400Json() throws Exception {
        mockMvc.perform(post("/api/v1/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"longUrl\":\"https://example.com/<b>xss</b>\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(containsString("HTML")));
    }

    @Test
    void malformedUrlReturns400ErrorJson() throws Exception {
        mockMvc.perform(post("/api/v1/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"longUrl\":\"not-a-valid-url\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(not(emptyOrNullString())));
    }

    @Test
    void selfLoopReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ShortenRequest("http://localhost:8080/loop", 1))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getActiveMappingReturns302WithLocation() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ShortenRequest("https://example.com/dest", 10))))
                .andExpect(status().isCreated())
                .andReturn();
        String code = objectMapper.readTree(created.getResponse().getContentAsString()).get("shortCode").asText();

        mockMvc.perform(get("/short/" + code))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://example.com/dest"));
    }

    @Test
    void unknownCodeReturnsFriendlyHtml() throws Exception {
        mockMvc.perform(get("/short/zzzzz"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Page not found")))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("Whitelabel"))));
    }

    @Test
    void openApiDocsListShortenAndOmitRedirect() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").value(containsString("3.")))
                .andExpect(jsonPath("$.info.title").value("URL Shortener API"))
                .andExpect(jsonPath("$.info.version").value("0.1.0"))
                .andExpect(jsonPath("$.paths['/api/v1/shorten']").exists())
                .andExpect(jsonPath("$.paths['/short/{shortCode}']").doesNotExist());
    }

    @Test
    void expiredMappingReturns404Html() throws Exception {
        UrlMapping expired = new UrlMapping();
        expired.setLongUrl("https://example.com/old");
        expired.setShortCode("exp01");
        expired.setCreatedAt(Instant.now().minus(10, ChronoUnit.DAYS));
        expired.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
        repository.save(expired);

        mockMvc.perform(get("/short/exp01"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Page not found")));
    }

    @Test
    void illegalPathsReturnFriendlyHtml() throws Exception {
        mockMvc.perform(get("/b9K2x1"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(containsString("Page not found")))
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("Whitelabel"))));
        mockMvc.perform(get("/"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("Page not found")));
        mockMvc.perform(get("/nope"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("/swagger-ui.html")));
        mockMvc.perform(get("/api/v1/shorten"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("text/html"));
    }
}
