package jk.kamoru.ground.flay.domain;

import lombok.Data;

@Data
public class FlayCondition {

  public static enum Sort {
    STUDIO, OPUS, TITLE, ACTRESS, RELEASE, PLAY, RANK, LASTPLAY, LASTACCESS, LASTMODIFIED, SCORE, LENGTH, SHOT;
  }

  private Sort sort = Sort.RELEASE;
  private boolean reverse = false;

  private String studio;
  private String opus;
  private String title;
  private String actress;
  private String release;
  private int[] rank = new int[] { 0, 1, 2, 3, 4, 5 };
  private String search;
  private boolean withSubtitles = false;
  private boolean withFavorite = false;
  private boolean withNoFavorite = false;

}
