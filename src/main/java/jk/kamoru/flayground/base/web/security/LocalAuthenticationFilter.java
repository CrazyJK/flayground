package jk.kamoru.flayground.base.web.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
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

import jk.kamoru.flayground.Flayground;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LocalAuthenticationFilter extends OncePerRequestFilter {

	private final static String LOCAL_IP = "localhost 127.0.0.1 0:0:0:0:0:0:0:1 " + Flayground.SERVER_IP;
	private final static String LOCAL_NAME = "admin";
	private final static String LOCAL_PASS = "local";
	private final static Collection<? extends GrantedAuthority> LOCAL_AUTHORITIES = Arrays.stream(new String[] { "ROLE_ADMIN", "ROLE_USER" }).map(SimpleGrantedAuthority::new).collect(Collectors.toList());

	private static List<String> connectedIpList = new ArrayList<>();

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
		String remoteAddr = request.getRemoteAddr();

		if (!connectedIpList.contains(remoteAddr)) {
			connectedIpList.add(remoteAddr);
			log.info("LOCAL_IP {}", LOCAL_IP);
			log.info("New User is Connected. IP: {}", remoteAddr);
		}

		if (SecurityContextHolder.getContext().getAuthentication() == null) {
			if (StringUtils.contains(LOCAL_IP, remoteAddr)) {
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(new User(LOCAL_NAME, LOCAL_PASS, LOCAL_AUTHORITIES), LOCAL_PASS, LOCAL_AUTHORITIES);
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				log.debug("authentication {}", authentication);
				log.info("{} is {}", remoteAddr, LOCAL_NAME);

				SecurityContextHolder.getContext().setAuthentication(authentication);
			}
		}
		chain.doFilter(request, response);
	}

}
