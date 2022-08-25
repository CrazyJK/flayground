package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.Data;

@Data
public class FlayCollector {

  public static enum Sort {
    STUDIO, OPUS, TITLE, ACTRESS, RELEASE, PLAY, RANK, LASTACCESS, LASTMODIFIED, SCORE, LENGTH;
  }

  static ScoreCalculator scoreCalculator = new ScoreCalculator();

  private Sort sort;

  private String studio;
  private String opus;
  private String title;
  private String actress;
  private String release;
  private Integer[] rank;

  public List<String> toOpusList(Collection<Flay> list) {
    return list.stream().filter(flay -> filter(flay)).sorted((f1, f2) -> sort(f1, f2)).map(Flay::getOpus).collect(Collectors.toList());
  }

  public List<Flay> toFlayList(Collection<Flay> list) {
    return list.stream().filter(flay -> filter(flay)).sorted((f1, f2) -> sort(f1, f2)).collect(Collectors.toList());
  }

  private boolean filter(Flay flay) {
    return likeStudio(flay) && likeOpus(flay) && likeTitle(flay) && likeActress(flay) && likeRelease(flay) && containsRank(flay);
  }

  private boolean likeStudio(Flay flay) {
    return studio == null || StringUtils.containsIgnoreCase(flay.getStudio(), studio);
  }

  private boolean likeOpus(Flay flay) {
    return opus == null || StringUtils.containsIgnoreCase(flay.getOpus(), opus);
  }

  private boolean likeTitle(Flay flay) {
    return title == null || StringUtils.containsIgnoreCase(flay.getTitle(), title);
  }

  private boolean likeActress(Flay flay) {
    return actress == null || StringUtils.containsIgnoreCase(String.join(",", flay.getActressList()), actress);
  }

  private boolean likeRelease(Flay flay) {
    return release == null || StringUtils.contains(flay.getRelease(), release);
  }

  private boolean containsRank(Flay flay) {
    return rank == null || rank.length == 0 || ArrayUtils.contains(rank, flay.getVideo().getRank());
  }

  private int sort(Flay f1, Flay f2) {
    switch (sort) {
      case STUDIO:
        return f1.getStudio().compareTo(f2.getStudio());
      case OPUS:
        return f1.getOpus().compareTo(f2.getOpus());
      case TITLE:
        return f1.getTitle().compareTo(f2.getTitle());
      case ACTRESS:
        return String.join(",", f1.getActressList()).compareTo(String.join(",", f2.getActressList()));
      case RELEASE:
        return f1.getRelease().compareTo(f2.getRelease());
      case PLAY:
        return f1.getVideo().getPlay() - f2.getVideo().getPlay();
      case RANK:
        return f1.getVideo().getRank() - f2.getVideo().getRank();
      case LASTACCESS:
        return Long.valueOf(f1.getVideo().getLastAccess() - f2.getVideo().getLastAccess()).intValue();
      case LASTMODIFIED:
        return Long.valueOf(f1.getLastModified() - f2.getLastModified()).intValue();
      case SCORE:
        scoreCalculator.calcScore(f1);
        scoreCalculator.calcScore(f2);
        return f1.getScore() - f2.getScore();
      case LENGTH:
        return Long.valueOf(f1.getLength() - f2.getLength()).intValue();
      default:
        return 0;
    }
  }

}
