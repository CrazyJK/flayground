package jk.kamoru.flayground.history.domain;

import java.text.MessageFormat;
import java.util.Date;

import org.apache.commons.lang3.StringUtils;

import jk.kamoru.flayground.Flayground;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class History {

  public static enum Action {
    PLAY, DELETE, UPDATE;
  }

  String date;
  String opus;
  Action action;
  String desc;

  public History(String opus, Action action, String desc) {
    this.date = Flayground.Format.Date.DateTime.format(new Date());
    this.opus = opus;
    this.action = action;
    this.desc = desc;
  }

  public String toFileSaveString() {
    return MessageFormat.format("{0}, {1}, {2}, {3}{4}", date, opus, action, StringUtils.trimToEmpty(desc), Flayground.LINE);
  }

  public boolean match(String query) {
    return date.contains(query) || opus.equals(query) || action.name().equals(query) || desc.contains(query);
  }

}
