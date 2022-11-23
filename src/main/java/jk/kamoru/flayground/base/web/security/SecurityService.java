package jk.kamoru.flayground.base.web.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class SecurityService {

  public Object getUser() {
    return SecurityContextHolder.getContext().getAuthentication().getPrincipal();
  }

  public String getUsername() {
    return SecurityContextHolder.getContext().getAuthentication().getName();
  }

}
