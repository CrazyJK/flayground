package jk.kamoru.flayground.base.access;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AccessLogConfig implements WebMvcConfigurer {

	@Autowired AccessLogService accessLogService;
	
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new AccessLogInterceptor(accessLogService));
	}

}
