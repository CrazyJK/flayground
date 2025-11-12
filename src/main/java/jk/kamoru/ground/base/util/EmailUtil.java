package jk.kamoru.ground.base.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.extern.slf4j.Slf4j;

/**
 * 이메일 유틸리티 클래스
 * 이메일 주소를 파싱하고 도메인별로 정렬하는 기능을 제공합니다.
 */
@Slf4j
public class EmailUtil {

  // ReDoS 방지를 위해 간단하고 명확한 패턴 사용
  // 로컬 파트와 도메인 파트를 명확히 구분하여 백트래킹 최소화
  private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*\\.[a-zA-Z]{2,}");
  
  // 최대 텍스트 길이 제한 (DoS 공격 방지)
  private static final int MAX_TEXT_LENGTH = 100000;

  /**
   * 텍스트에서 이메일 주소를 추출합니다.
   *
   * @param text 이메일 주소가 포함된 텍스트
   * @return 추출된 이메일 주소 목록
   */
  public static List<String> extractEmails(String text) {
    List<String> emails = new ArrayList<>();
    
    if (text == null || text.trim().isEmpty()) {
      return emails;
    }

    // 너무 긴 텍스트는 처리하지 않음 (DoS 방지)
    if (text.length() > MAX_TEXT_LENGTH) {
      log.warn("Text is too long ({} characters), truncating to {}", text.length(), MAX_TEXT_LENGTH);
      text = text.substring(0, MAX_TEXT_LENGTH);
    }

    Matcher matcher = EMAIL_PATTERN.matcher(text);
    while (matcher.find()) {
      emails.add(matcher.group());
    }

    log.debug("Extracted {} emails from text", emails.size());
    return emails;
  }

  /**
   * 이메일 주소 목록을 도메인별로 정렬합니다.
   *
   * @param emails 이메일 주소 목록
   * @return 도메인별로 정렬된 이메일 주소 목록
   */
  public static List<String> sortByDomain(List<String> emails) {
    if (emails == null || emails.isEmpty()) {
      return new ArrayList<>();
    }

    List<String> sortedEmails = new ArrayList<>(emails);
    Collections.sort(sortedEmails, new Comparator<String>() {
      @Override
      public int compare(String email1, String email2) {
        String domain1 = getDomain(email1);
        String domain2 = getDomain(email2);
        
        // 도메인으로 먼저 정렬
        int domainCompare = domain1.compareToIgnoreCase(domain2);
        if (domainCompare != 0) {
          return domainCompare;
        }
        
        // 도메인이 같으면 이메일 전체로 정렬
        return email1.compareToIgnoreCase(email2);
      }
    });

    log.debug("Sorted {} emails by domain", sortedEmails.size());
    return sortedEmails;
  }

  /**
   * 이메일 주소에서 도메인을 추출합니다.
   *
   * @param email 이메일 주소
   * @return 도메인
   */
  public static String getDomain(String email) {
    if (email == null || !email.contains("@")) {
      return "";
    }
    return email.substring(email.indexOf("@") + 1);
  }

  /**
   * 이메일 목록을 쉼표로 구분된 문자열로 변환합니다.
   *
   * @param emails 이메일 주소 목록
   * @return 쉼표로 구분된 이메일 문자열
   */
  public static String joinWithComma(List<String> emails) {
    if (emails == null || emails.isEmpty()) {
      return "";
    }
    return String.join(", ", emails);
  }

  /**
   * 이메일 목록에서 중복을 제거합니다 (대소문자 구분 없음).
   *
   * @param emails 이메일 주소 목록
   * @return 중복이 제거된 이메일 주소 목록
   */
  public static List<String> removeDuplicates(List<String> emails) {
    if (emails == null || emails.isEmpty()) {
      return new ArrayList<>();
    }

    LinkedHashSet<String> uniqueEmails = new LinkedHashSet<>();
    for (String email : emails) {
      // 대소문자를 구분하지 않고 중복 제거
      boolean isDuplicate = false;
      for (String existing : uniqueEmails) {
        if (existing.equalsIgnoreCase(email)) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        uniqueEmails.add(email);
      }
    }

    log.debug("Removed {} duplicate emails", emails.size() - uniqueEmails.size());
    return new ArrayList<>(uniqueEmails);
  }

  /**
   * 텍스트에서 이메일을 추출하고 도메인별로 정렬하여 쉼표로 구분된 문자열로 반환합니다.
   *
   * @param text 이메일 주소가 포함된 텍스트
   * @return 도메인별로 정렬된 이메일 문자열
   */
  public static String extractSortAndJoin(String text) {
    List<String> emails = extractEmails(text);
    List<String> uniqueEmails = removeDuplicates(emails);
    List<String> sortedEmails = sortByDomain(uniqueEmails);
    return joinWithComma(sortedEmails);
  }

}
