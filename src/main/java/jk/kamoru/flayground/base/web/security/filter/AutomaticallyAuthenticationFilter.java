package jk.kamoru.flayground.base.web.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class AutomaticallyAuthenticationFilter extends OncePerRequestFilter {

	private final static String LOCAL_NAME = "admin";
	private final static String LOCAL_PASS = "local";
	private final static Collection<? extends GrantedAuthority> LOCAL_AUTHORITIES = Arrays.stream(new String[] { "ROLE_ADMIN", "ROLE_USER" }).map(SimpleGrantedAuthority::new).collect(Collectors.toList());

	private List<String> automaticallyCertificatedIp;

	public AutomaticallyAuthenticationFilter(List<String> automaticallyCertificatedIp) {
		this.automaticallyCertificatedIp = automaticallyCertificatedIp;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
		if (SecurityContextHolder.getContext().getAuthentication() == null) {
			String remoteAddr = request.getRemoteAddr();
			log.info("New IP is Connected. {}", remoteAddr);

			if (automaticallyCertificatedIp.contains(remoteAddr)) {
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(new User(LOCAL_NAME, LOCAL_PASS, LOCAL_AUTHORITIES), LOCAL_PASS, LOCAL_AUTHORITIES);
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				log.debug("authentication {}", authentication);

				SecurityContextHolder.getContext().setAuthentication(authentication);
				log.info("{} is logged in {}", remoteAddr, LOCAL_NAME);
			}
		}
		chain.doFilter(request, response);
	}

}
