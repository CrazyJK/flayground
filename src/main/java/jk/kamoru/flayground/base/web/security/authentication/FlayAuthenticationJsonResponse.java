package jk.kamoru.flayground.base.web.security.authentication;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * response dto for json login request
 *
 * @see #sendResponse(HttpServletResponse, FlayAuthenticationJsonResponse)
 * @author kamoru
 *
 */
@AllArgsConstructor
@Data
public class FlayAuthenticationJsonResponse {

  private boolean result;

  private String username;

  @JsonIgnore private Authentication authentication;

  @JsonIgnore private AuthenticationException exception;

  public List<String> getAuthorities() {
    if (authentication != null)
      return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList());
    return null;
  }

  public String getExceptionMessage() {
    if (exception != null)
      return exception.getMessage();
    return null;
  }

  /**
   * send flayAuthenticationJsonResponse to response
   *
   * @param response
   * @param flayAuthenticationJsonResponse
   * @throws HttpMessageNotWritableException
   * @throws IOException
   */
  public static void sendResponse(HttpServletResponse response, FlayAuthenticationJsonResponse flayAuthenticationJsonResponse) throws HttpMessageNotWritableException, IOException {
    new MappingJackson2HttpMessageConverter().write(flayAuthenticationJsonResponse, MediaType.APPLICATION_JSON, new ServletServerHttpResponse(response));
  }

}

