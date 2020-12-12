package jk.kamoru.flayground.base.web.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LocalAuthenticationFilter extends OncePerRequestFilter {

	private final static String LOCAL_IP = "localhost 0:0:0:0:0:0:0:1";
	private final static String LOCAL_NAME = "admin";
	private final static String LOCAL_PASS = "local";
	private final static Collection<? extends GrantedAuthority> LOCAL_AUTHORITIES = Arrays.stream(new String[] { "ROLE_ADMIN", "ROLE_USER" }).map(SimpleGrantedAuthority::new).collect(Collectors.toList());

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
		if (SecurityContextHolder.getContext().getAuthentication() == null) {
			if (StringUtils.contains(LOCAL_IP, request.getRemoteAddr())) {
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(new User(LOCAL_NAME, LOCAL_PASS, LOCAL_AUTHORITIES), LOCAL_PASS, LOCAL_AUTHORITIES);
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				log.info("authentication {}", authentication);

				SecurityContextHolder.getContext().setAuthentication(authentication);
			}
		}
		chain.doFilter(request, response);
	}

}
