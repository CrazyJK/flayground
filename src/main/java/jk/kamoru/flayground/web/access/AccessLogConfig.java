package jk.kamoru.flayground.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jk.kamoru.flayground.web.access.AccessLogInterceptor;
import jk.kamoru.flayground.web.access.AccessLogService;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Autowired AccessLogService accessLogService;
	
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new AccessLogInterceptor(accessLogService));
	}

}
