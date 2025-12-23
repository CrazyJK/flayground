package jk.kamoru.ground.base.util;

public class EmailUtilDemo {

  public static void main(String[] args) {
    // 문제 명세서의 이메일 목록
    String emailText = "hslee@handysoft.co.kr <hslee@handysoft.co.kr>, Kenneth Junwon Cha<freeguy4@polarisoffice.com>, "
        + "Daniel Ilseon Yoon<daniel.i.yoon@polarisoffice.com>, Bill Younghun Lee<20hoon@polarisoffice.com>, "
        + "weboffice <weboffice@polarisoffice.com>,shhan@handysoft.co.kr <shhan@handysoft.co.kr>, "
        + "superman@handysoft.co.kr<superman@handysoft.co.kr>, 이 상엽<sylee@handysoft.co.kr>, "
        + "김 용세<sparrow@handysoft.co.kr>, kjcho@handysoft.co.kr <kjcho@handysoft.co.kr>,"
        + "hichoi@handysoft.co.kr <hichoi@handysoft.co.kr>, namjk24@handysoft.co.kr<namjk24@handysoft.co.kr>, "
        + "sin1024@handysoft.co.kr<sin1024@handysoft.co.kr>, buchoi@handysoft.co.kr <buchoi@handysoft.co.kr>,"
        + "speryon90@handysoft.co.kr <speryon90@handysoft.co.kr>";

    System.out.println("=== 원본 텍스트 ===");
    System.out.println(emailText);
    System.out.println();

    System.out.println("=== 추출된 이메일 (도메인별 정렬) ===");
    String sortedEmails = EmailUtil.extractSortAndJoin(emailText);
    System.out.println(sortedEmails);
    System.out.println();

    System.out.println("=== 도메인별로 구분하여 출력 ===");
    java.util.List<String> emails = EmailUtil.extractEmails(emailText);
    java.util.List<String> uniqueEmails = EmailUtil.removeDuplicates(emails);
    java.util.List<String> sorted = EmailUtil.sortByDomain(uniqueEmails);
    
    String currentDomain = "";
    for (String email : sorted) {
      String domain = EmailUtil.getDomain(email);
      if (!domain.equals(currentDomain)) {
        System.out.println("\n[" + domain + "]");
        currentDomain = domain;
      }
      System.out.println("  - " + email);
    }
    
    System.out.println("\n총 " + emails.size() + "개의 이메일 주소가 발견되었고, 중복 제거 후 " + sorted.size() + "개입니다.");
  }

}
