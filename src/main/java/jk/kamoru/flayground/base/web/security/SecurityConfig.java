package jk.kamoru.flayground.base.web.security;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.navercorp.lucy.security.xss.servletfilter.XssEscapeServletFilter;

@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

	@Override
	public void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth.inMemoryAuthentication()
				.withUser("admin").password("{noop}6974").roles("ADMIN") // {noop} for plain text
				.and()
				.withUser("kamoru").password("{noop}3806").roles("USER");
	}

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.headers().frameOptions().sameOrigin();
		http.csrf().disable();
		http.authorizeRequests()
				.antMatchers("/", "/index.html", "/webjars/**", "/img/**", "/css/**", "/font/**").permitAll()
				.antMatchers("/batch/**").hasRole("ADMIN")
				.anyRequest().authenticated()
				.and()
			.formLogin()
				.loginPage("/html/login.html").permitAll()
				.and()
			.rememberMe()
				.rememberMeParameter("remember-me")
				.and()
			.logout()
				.logoutSuccessUrl("/").permitAll()
				.and()
			.addFilterBefore(localAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
			.httpBasic();
	}

	@Bean
	public LocalAuthenticationFilter localAuthenticationFilter() {
		return new LocalAuthenticationFilter();
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
