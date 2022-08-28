package jk.kamoru.flayground.flay.domain;

import lombok.Data;

@Data
public class FlayCondition {

  public static enum Sort {
    STUDIO, OPUS, TITLE, ACTRESS, RELEASE, PLAY, RANK, LASTACCESS, LASTMODIFIED, SCORE, LENGTH;
  }

  private Sort sort;

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
