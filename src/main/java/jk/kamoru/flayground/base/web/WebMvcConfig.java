package jk.kamoru.flayground.base.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.navercorp.lucy.security.xss.servletfilter.XssEscapeServletFilter;

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

	@Bean
	public FilterRegistrationBean<XssEscapeServletFilter> getXssFilterRegistrationBean() {
		FilterRegistrationBean<XssEscapeServletFilter> registrationBean = new FilterRegistrationBean<XssEscapeServletFilter>();
		registrationBean.setFilter(new XssEscapeServletFilter());
		registrationBean.setOrder(1);
		registrationBean.addUrlPatterns("/*");
		return registrationBean;
	}

}
