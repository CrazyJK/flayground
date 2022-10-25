package jk.kamoru.flayground.code.split;

import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.Test;

public class SplitTest {


  @Test
  void test() {
    String str = "태그 이름, 태그 설명, 태그설명2";
    String[] arr = StringUtils.split(str, ",");
    for (String s : arr) {
      System.out.println(s);
    }
  }
}

