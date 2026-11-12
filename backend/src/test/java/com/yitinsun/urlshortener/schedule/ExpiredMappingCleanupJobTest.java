package com.yitinsun.urlshortener.schedule;

import com.yitinsun.urlshortener.repo.UrlMappingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpiredMappingCleanupJobTest {

    @Mock
    private UrlMappingRepository repository;

    @Test
    void deleteExpiredPassesACutoffToTheParameterizedQuery() {
        when(repository.deleteExpiredBefore(org.mockito.ArgumentMatchers.any(Instant.class))).thenReturn(2);
        ExpiredMappingCleanupJob job = new ExpiredMappingCleanupJob(repository);

        assertThat(job.deleteExpired()).isEqualTo(2);

        ArgumentCaptor<Instant> cutoff = ArgumentCaptor.forClass(Instant.class);
        verify(repository).deleteExpiredBefore(cutoff.capture());
        assertThat(cutoff.getValue()).isNotNull();
    }
}
