package jk.kamoru.ground;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

public class GroundControllerTest {

  @Test
  public void testSortEmails() {
    GroundController controller = new GroundController();
    
    Map<String, String> request = new HashMap<>();
    request.put("text", "hslee@handysoft.co.kr, freeguy4@polarisoffice.com, shhan@handysoft.co.kr");
    
    Map<String, Object> response = controller.sortEmails(request);
    
    assertNotNull(response);
    assertTrue(response.containsKey("original"));
    assertTrue(response.containsKey("emails"));
    assertTrue(response.containsKey("joined"));
    assertTrue(response.containsKey("count"));
    
    @SuppressWarnings("unchecked")
    List<String> emails = (List<String>) response.get("emails");
    assertEquals(3, emails.size());
    
    // handysoft.co.kr 도메인이 먼저 나와야 함
    assertTrue(emails.get(0).contains("handysoft.co.kr"));
    assertTrue(emails.get(1).contains("handysoft.co.kr"));
    // polarisoffice.com 도메인이 마지막에 나와야 함
    assertTrue(emails.get(2).contains("polarisoffice.com"));
  }

}
