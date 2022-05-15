package jk.kamoru.flayground.base.web.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.base.web.security.authentication.FlayAuthenticationFailureHandler;
import jk.kamoru.flayground.base.web.security.authentication.FlayAuthenticationSuccessHandler;
import jk.kamoru.flayground.base.web.security.filter.AutomaticallyAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

	@Autowired FlayProperties flayProperties;

	@Override
	public void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth.inMemoryAuthentication()
				.withUser("admin").password("{noop}6974").roles("ADMIN") // {noop} for plain text
				.and()
				.withUser("kamoru").password("{noop}3806").roles("USER");
	}

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.headers()
				.frameOptions().sameOrigin()
				.and()
			.csrf()
				.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
				.and()
			.cors()
				.configurationSource(getCorsConfigurationSource())
				.and()
			.authorizeRequests()
				.requestMatchers(CorsUtils::isPreFlightRequest).permitAll()
				.antMatchers("/", "/favicon.ico", "/index.html", "/webjars/**").permitAll()
				.antMatchers("/batch/**").hasRole("ADMIN")
				.anyRequest().authenticated()
				.and()
			.formLogin()
				.loginPage("/dist/login.html").permitAll()
				.successHandler(getFlayAuthenticationSuccessHandler())
				.failureHandler(getFlayAuthenticationFailureHandler())
				.and()
			.rememberMe()
				.rememberMeParameter("remember-me")
				.and()
			.logout()
				.logoutSuccessUrl("/")
				.and()
			.addFilterBefore(automaticallyAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
			.httpBasic();
	}

	@Bean
	public AutomaticallyAuthenticationFilter automaticallyAuthenticationFilter() {
		return new AutomaticallyAuthenticationFilter(flayProperties.getAutomaticallyCertificatedIp());
	}

    @Bean
	public AuthenticationSuccessHandler getFlayAuthenticationSuccessHandler() {
		return new FlayAuthenticationSuccessHandler();
	}

    @Bean
	public AuthenticationFailureHandler getFlayAuthenticationFailureHandler() {
		return new FlayAuthenticationFailureHandler();
	}

	@Bean
	public CorsConfigurationSource getCorsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.addAllowedOriginPattern("*");
		config.addAllowedMethod("*");
		config.addAllowedHeader("*");
		config.setAllowCredentials(true);
		config.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);

		return source;
	}

}
