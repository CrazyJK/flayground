package jk.kamoru.flayground.base.web.security.authentication;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FlayAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
    String accept = request.getHeader("accept");
    log.debug("header - accept: {}", accept);

    if (accept.matches(".*application/json.*")) {
      User user = (User) authentication.getPrincipal();
      FlayAuthenticationJsonResponse successResponse = new FlayAuthenticationJsonResponse(true, user.getUsername(), authentication, null);
      FlayAuthenticationJsonResponse.sendResponse(response, successResponse);
      log.info("login success - user: {}", user.getUsername());
    } else {
      super.onAuthenticationSuccess(request, response, authentication);
    }
  }

}
