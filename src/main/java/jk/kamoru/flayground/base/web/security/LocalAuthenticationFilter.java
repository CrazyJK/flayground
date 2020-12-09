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

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
		String remoteAddr = request.getRemoteAddr();

		if (SecurityContextHolder.getContext().getAuthentication() == null) {
			if (StringUtils.contains("localhost 0:0:0:0:0:0:0:1", remoteAddr)) {
				String[] roles = new String[] { "ROLE_ADMIN", "ROLE_USER" };
				Collection<? extends GrantedAuthority> authorities = Arrays.stream(roles).map(SimpleGrantedAuthority::new).collect(Collectors.toList());

				String username = "admin";
				String password = "";
				User principal = new User(username, password, authorities);

				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(principal, password, authorities);
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

				SecurityContextHolder.getContext().setAuthentication(authentication);

				log.info("authentication {}", authentication);
			}
		}

		chain.doFilter(request, response);
	}

}
