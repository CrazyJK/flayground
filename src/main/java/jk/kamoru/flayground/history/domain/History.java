package jk.kamoru.flayground.history.domain;

import java.text.MessageFormat;
import org.apache.commons.lang3.StringUtils;
import jk.kamoru.flayground.Flayground;
import lombok.Data;

@Data
public class History {

  public static enum Action {
    PLAY, DELETE, UPDATE;
  }

  Long id;
  String date;
  String opus;
  Action action;
  String desc;

  public History() {}

  public History(Action action, String opus, String desc) {
    this.action = action;
    this.opus = opus;
    this.desc = desc;
  }

  public String toFileSaveString() {
    return MessageFormat.format("{0}, {1}, {2}, {3}{4}", date, opus, action, StringUtils.trimToEmpty(desc), Flayground.LINE);
  }

}
