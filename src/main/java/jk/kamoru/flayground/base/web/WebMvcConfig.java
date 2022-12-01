package jk.kamoru.flayground.base.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import jk.kamoru.flayground.base.web.access.AccessLogInterceptor;
import jk.kamoru.flayground.base.web.access.service.AccessLogService;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Autowired AccessLogService accessLogService;

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(getAccessLogInterceptor());
  }

  @Bean
  public AccessLogInterceptor getAccessLogInterceptor() {
    return new AccessLogInterceptor(accessLogService);
  }

}
