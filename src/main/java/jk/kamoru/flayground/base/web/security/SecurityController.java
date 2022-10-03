package jk.kamoru.flayground.base.web.security;

import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jk.kamoru.flayground.FlayProperties;

@RestController
@RequestMapping("/security")
public class SecurityController {

  @Autowired FlayProperties flayProperties;

  @GetMapping("/whoami")
  public Object getUser() {
    return SecurityContextHolder.getContext().getAuthentication().getPrincipal();
  }

  @GetMapping("/isAutomaticallyCertificated")
  public boolean isAutomaticallyCertificated(HttpServletRequest request) {
    return flayProperties.getAutomaticallyCertificatedIp().contains(request.getRemoteAddr());
  }

}
