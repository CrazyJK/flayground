package jk.kamoru.ground.base.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

public class EmailUtilTest {

  @Test
  public void testExtractEmails() {
    String text = "hslee@handysoft.co.kr <hslee@handysoft.co.kr>, Kenneth Junwon Cha<freeguy4@polarisoffice.com>, "
        + "Daniel Ilseon Yoon<daniel.i.yoon@polarisoffice.com>, Bill Younghun Lee<20hoon@polarisoffice.com>";
    
    List<String> emails = EmailUtil.extractEmails(text);
    
    assertNotNull(emails);
    assertEquals(5, emails.size());
    assertTrue(emails.contains("hslee@handysoft.co.kr"));
    assertTrue(emails.contains("freeguy4@polarisoffice.com"));
  }

  @Test
  public void testExtractEmailsEmpty() {
    String text = "";
    List<String> emails = EmailUtil.extractEmails(text);
    
    assertNotNull(emails);
    assertEquals(0, emails.size());
  }

  @Test
  public void testExtractEmailsNull() {
    List<String> emails = EmailUtil.extractEmails(null);
    
    assertNotNull(emails);
    assertEquals(0, emails.size());
  }

  @Test
  public void testSortByDomain() {
    List<String> emails = Arrays.asList(
        "hslee@handysoft.co.kr",
        "freeguy4@polarisoffice.com",
        "daniel.i.yoon@polarisoffice.com",
        "shhan@handysoft.co.kr"
    );
    
    List<String> sorted = EmailUtil.sortByDomain(emails);
    
    assertNotNull(sorted);
    assertEquals(4, sorted.size());
    
    // handysoft.co.kr 도메인이 먼저 나와야 함
    assertEquals("hslee@handysoft.co.kr", sorted.get(0));
    assertEquals("shhan@handysoft.co.kr", sorted.get(1));
    // polarisoffice.com 도메인이 다음에 나와야 함
    assertEquals("daniel.i.yoon@polarisoffice.com", sorted.get(2));
    assertEquals("freeguy4@polarisoffice.com", sorted.get(3));
  }

  @Test
  public void testGetDomain() {
    assertEquals("handysoft.co.kr", EmailUtil.getDomain("hslee@handysoft.co.kr"));
    assertEquals("polarisoffice.com", EmailUtil.getDomain("freeguy4@polarisoffice.com"));
    assertEquals("", EmailUtil.getDomain("invalid-email"));
    assertEquals("", EmailUtil.getDomain(null));
  }

  @Test
  public void testJoinWithComma() {
    List<String> emails = Arrays.asList(
        "hslee@handysoft.co.kr",
        "freeguy4@polarisoffice.com",
        "daniel.i.yoon@polarisoffice.com"
    );
    
    String joined = EmailUtil.joinWithComma(emails);
    
    assertNotNull(joined);
    assertEquals("hslee@handysoft.co.kr, freeguy4@polarisoffice.com, daniel.i.yoon@polarisoffice.com", joined);
  }

  @Test
  public void testJoinWithCommaEmpty() {
    List<String> emails = Arrays.asList();
    String joined = EmailUtil.joinWithComma(emails);
    
    assertNotNull(joined);
    assertEquals("", joined);
  }

  @Test
  public void testExtractSortAndJoin() {
    String text = "hslee@handysoft.co.kr, Kenneth Junwon Cha<freeguy4@polarisoffice.com>, "
        + "shhan@handysoft.co.kr, Daniel<daniel.i.yoon@polarisoffice.com>";
    
    String result = EmailUtil.extractSortAndJoin(text);
    
    assertNotNull(result);
    assertTrue(result.contains("handysoft.co.kr"));
    assertTrue(result.contains("polarisoffice.com"));
    
    // handysoft.co.kr 도메인이 먼저 나와야 함
    int handysoftIndex = result.indexOf("handysoft.co.kr");
    int polarisIndex = result.indexOf("polarisoffice.com");
    assertTrue(handysoftIndex < polarisIndex);
  }

  @Test
  public void testRemoveDuplicates() {
    List<String> emails = Arrays.asList(
        "hslee@handysoft.co.kr",
        "HSLEE@handysoft.co.kr",
        "hslee@HANDYSOFT.CO.KR",
        "freeguy4@polarisoffice.com"
    );
    
    List<String> unique = EmailUtil.removeDuplicates(emails);
    
    assertNotNull(unique);
    assertEquals(2, unique.size());
    assertTrue(unique.contains("hslee@handysoft.co.kr"));
    assertTrue(unique.contains("freeguy4@polarisoffice.com"));
  }

  @Test
  public void testProblemStatementEmails() {
    String text = "hslee@handysoft.co.kr <hslee@handysoft.co.kr>, Kenneth Junwon Cha<freeguy4@polarisoffice.com>, "
        + "Daniel Ilseon Yoon<daniel.i.yoon@polarisoffice.com>, Bill Younghun Lee<20hoon@polarisoffice.com>, "
        + "weboffice <weboffice@polarisoffice.com>,shhan@handysoft.co.kr <shhan@handysoft.co.kr>, "
        + "superman@handysoft.co.kr<superman@handysoft.co.kr>, 이 상엽<sylee@handysoft.co.kr>, "
        + "김 용세<sparrow@handysoft.co.kr>, kjcho@handysoft.co.kr <kjcho@handysoft.co.kr>,"
        + "hichoi@handysoft.co.kr <hichoi@handysoft.co.kr>, namjk24@handysoft.co.kr<namjk24@handysoft.co.kr>, "
        + "sin1024@handysoft.co.kr<sin1024@handysoft.co.kr>, buchoi@handysoft.co.kr <buchoi@handysoft.co.kr>,"
        + "speryon90@handysoft.co.kr <speryon90@handysoft.co.kr>";
    
    String result = EmailUtil.extractSortAndJoin(text);
    
    assertNotNull(result);
    
    // 중복 제거 확인
    List<String> emails = EmailUtil.extractEmails(text);
    List<String> sorted = EmailUtil.sortByDomain(emails);
    
    // 도메인별로 정렬되었는지 확인
    String previousDomain = "";
    for (String email : sorted) {
      String domain = EmailUtil.getDomain(email);
      assertTrue(domain.compareToIgnoreCase(previousDomain) >= 0, 
          "Emails should be sorted by domain: " + email + " comes after domain " + previousDomain);
      previousDomain = domain;
    }
  }

}
