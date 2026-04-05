package jk.kamoru.ground.memo;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class Memo {
  String html;
  long date;
  long size;
}
