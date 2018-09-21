package jk.kamoru.flayground;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

	@Override
	public void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth.inMemoryAuthentication()
				.withUser("admin").password("{noop}6969").roles("ADMIN") // {noop} for plain text
					.and()
				.withUser("kamoru").password("{noop}3806").roles("USER");
	}

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.csrf().disable();
		http
			.authorizeRequests()
				.antMatchers("/index.html", "/html/login.html", "/webjars/**").permitAll()
				.anyRequest().authenticated()
				.and()
			.formLogin()
				.loginPage("/html/login.html").permitAll()
				.and()
			.rememberMe()
//				.rememberMeParameter("")
				.and()
			.logout()
				.permitAll()
				.and()
			.httpBasic();
	}
	
}
