package jk.kamoru.flayground.base.web.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.base.web.security.authentication.FlayAuthenticationFailureHandler;
import jk.kamoru.flayground.base.web.security.authentication.FlayAuthenticationSuccessHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Autowired
  FlayProperties flayProperties;

  @Bean
  public InMemoryUserDetailsManager userDetailsService() {
    UserDetails user1 = User.withUsername("admin").password("{noop}6974").roles("ADMIN").build();
    UserDetails user2 = User.withUsername("kamoru").password("{noop}3806").roles("USER").build();
    return new InMemoryUserDetailsManager(user1, user2);
  }

  // https://spring.io/blog/2022/02/21/spring-security-without-the-websecurityconfigureradapter
  @Bean
  protected SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.headers()
        .frameOptions().sameOrigin()
        .and()
        .csrf()
        .disable()
        // .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
        // .and()
        .cors()
        .configurationSource(getCorsConfigurationSource())
        .and()
        .authorizeHttpRequests()
        .requestMatchers(CorsUtils::isPreFlightRequest).permitAll()
        .requestMatchers("/", "/favicon.ico", "/index.html", "/dist/img/**").permitAll() // "/flayground-websocket/**"
        // .requestMatchers("/dist/login.css", "/dist/login.js", "/dist/login.js.map", "/dist/login.css.map").permitAll() // for /dist/login.html
        .requestMatchers("/batch/**").hasRole("ADMIN")
        .anyRequest().authenticated()
        .and()
        .formLogin()
        .loginPage("/login.html").permitAll()
        .successHandler(getFlayAuthenticationSuccessHandler())
        .failureHandler(getFlayAuthenticationFailureHandler())
        .and()
        .rememberMe()
        .rememberMeParameter("remember-me")
        .and()
        .logout()
        .logoutSuccessUrl("/")
        .and()
        // .addFilterBefore(automaticallyAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
        .httpBasic();
    return http.build();
  }

  // @Bean
  // public AutomaticallyAuthenticationFilter automaticallyAuthenticationFilter() {
  //   return new AutomaticallyAuthenticationFilter(flayProperties.getAutomaticallyCertificatedIp());
  // }

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
