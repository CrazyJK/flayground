package jk.kamoru.flayground.base.web.access;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jk.kamoru.flayground.base.web.access.service.AccessLogService;

@Configuration
public class AccessLogConfig implements WebMvcConfigurer {

	@Autowired AccessLogService accessLogService;
	
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new AccessLogInterceptor(accessLogService));
	}

}
