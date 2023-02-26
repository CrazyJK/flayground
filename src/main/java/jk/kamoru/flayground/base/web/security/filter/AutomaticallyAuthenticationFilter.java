package jk.kamoru.flayground.base.web.security.filter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class AutomaticallyAuthenticationFilter extends OncePerRequestFilter {

  private final static String LOCAL_NAME = "local";
  private final static String LOCAL_PASS = "local";
  private final static Collection<? extends GrantedAuthority> LOCAL_AUTHORITIES = Arrays.stream(new String[] {"ROLE_ADMIN", "ROLE_USER"}).map(SimpleGrantedAuthority::new).toList();
  private final static List<String> REQUIRES_AUTHENTION_SUFFIX = Arrays.asList("html");

  private List<String> automaticallyCertificatedIp;

  public AutomaticallyAuthenticationFilter(List<String> automaticallyCertificatedIp) {
    this.automaticallyCertificatedIp = automaticallyCertificatedIp;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
    String requestURI = request.getRequestURI();
    if (requiresAuthentication(requestURI) && SecurityContextHolder.getContext().getAuthentication() == null) {
      String remoteAddr = request.getRemoteAddr();

      if (automaticallyCertificatedIp.contains(remoteAddr)) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(new User(LOCAL_NAME, LOCAL_PASS, LOCAL_AUTHORITIES), LOCAL_PASS, LOCAL_AUTHORITIES);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        log.debug("authentication {}", authentication);

        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.info("{} is logged in {}", remoteAddr, LOCAL_NAME);
      }

      log.info("New IP is Connected. {} - {}", remoteAddr, requestURI);
    }

    chain.doFilter(request, response);
  }

  private boolean requiresAuthentication(String requestURI) {
    int lastPathIndex = requestURI.lastIndexOf("/");
    String lastPath = requestURI.substring(lastPathIndex + 1);

    int lastCommaIndex = lastPath.lastIndexOf(".");
    if (lastCommaIndex < 0) {
      return true;
    }
    String suffix = lastPath.substring(lastCommaIndex + 1);
    return REQUIRES_AUTHENTION_SUFFIX.contains(suffix);
  }

}
