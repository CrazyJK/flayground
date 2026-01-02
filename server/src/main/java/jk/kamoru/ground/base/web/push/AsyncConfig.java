package jk.kamoru.ground.base.web.push;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Web Push 비동기 처리 설정
 */
@Configuration
@EnableAsync
public class AsyncConfig {

  /**
   * Web Push 전송을 위한 비동기 Executor - corePoolSize: 기본 스레드 수 (동시 발송 가능한 기본 수) - maxPoolSize: 최대 스레드 수 (부하 시 증가) - queueCapacity: 대기 큐 크기
   */
  @Bean(name = "webPushExecutor")
  public Executor webPushExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(10); // 기본 10개 스레드
    executor.setMaxPoolSize(50); // 최대 50개 스레드
    executor.setQueueCapacity(200); // 200개까지 대기 가능
    executor.setThreadNamePrefix("WebPush-");
    executor.setWaitForTasksToCompleteOnShutdown(true);
    executor.setAwaitTerminationSeconds(30);
    executor.initialize();
    return executor;
  }
}
