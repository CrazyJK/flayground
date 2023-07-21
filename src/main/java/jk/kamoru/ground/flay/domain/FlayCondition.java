package jk.kamoru.ground.flay.domain;

import lombok.Data;

@Data
public class FlayCondition {

  public static enum Sort {
    STUDIO, OPUS, TITLE, ACTRESS, RELEASE, PLAY, RANK, LASTPLAY, LASTACCESS, LASTMODIFIED, SCORE, LENGTH;
  }

  private Sort sort = Sort.OPUS;
  private boolean reverse = false;

  private String studio;
  private String opus;
  private String title;
  private String actress;
  private String release;
  private int[] rank;
  private String search;
  private boolean withSubtitles;
  private boolean withFavorite;
  private boolean withNoFavorite;

}
