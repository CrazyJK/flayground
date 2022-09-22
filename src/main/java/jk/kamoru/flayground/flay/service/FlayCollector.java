package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.domain.FlayCondition;
import jk.kamoru.flayground.info.service.ActressInfoService;

@Service
public class FlayCollector {

  @Autowired ActressInfoService actressInfoService;

  @Autowired ScoreCalculator scoreCalculator;

  public List<Flay> toFlayList(Collection<Flay> list, FlayCondition flayCondition) {
    return filterAndSort(list, flayCondition).toList();
  }

  public List<String> toStudioList(Collection<Flay> list, FlayCondition flayCondition) {
    return filterAndSort(list, flayCondition).map(Flay::getStudio).distinct().toList();
  }

  public List<String> toOpusList(Collection<Flay> list, FlayCondition flayCondition) {
    return filterAndSort(list, flayCondition).map(Flay::getOpus).toList();
  }

  public List<String> toTitleList(Collection<Flay> list, FlayCondition flayCondition) {
    return filterAndSort(list, flayCondition).map(Flay::getTitle).toList();
  }

  public List<String> toActressList(Collection<Flay> list, FlayCondition flayCondition) {
    return filterAndSort(list, flayCondition).map(Flay::getActressName).distinct().toList();
  }

  public List<String> toReleaseList(Collection<Flay> list, FlayCondition flayCondition) {
    return filterAndSort(list, flayCondition).map(Flay::getRelease).distinct().toList();
  }

  private Stream<Flay> filterAndSort(Collection<Flay> list, FlayCondition flayCondition) {
    return list.stream().filter(flay -> filter(flay, flayCondition)).sorted((f1, f2) -> sort(f1, f2, flayCondition));
  }

  private boolean filter(Flay flay, FlayCondition flayCondition) {
    return likeStudio(flay, flayCondition.getStudio())
        && likeOpus(flay, flayCondition.getOpus())
        && likeTitle(flay, flayCondition.getTitle())
        && likeActress(flay, flayCondition.getActress())
        && likeRelease(flay, flayCondition.getRelease())
        && likeSearch(flay, flayCondition)
        && containsRank(flay, flayCondition.getRank())
        && containsSubtitles(flay, flayCondition.isWithSubtitles())
        && containsFavorite(flay, flayCondition);
  }

  private boolean likeStudio(Flay flay, String studio) {
    return StringUtils.isBlank(studio) || StringUtils.containsIgnoreCase(flay.getStudio(), studio);
  }

  private boolean likeOpus(Flay flay, String opus) {
    return StringUtils.isBlank(opus) || StringUtils.containsIgnoreCase(flay.getOpus(), opus);
  }

  private boolean likeTitle(Flay flay, String title) {
    return StringUtils.isBlank(title) || StringUtils.containsIgnoreCase(flay.getTitle(), title);
  }

  private boolean likeActress(Flay flay, String actress) {
    return StringUtils.isBlank(actress) || StringUtils.containsIgnoreCase(String.join(",", flay.getActressList()), actress);
  }

  private boolean likeRelease(Flay flay, String release) {
    return StringUtils.isBlank(release) || StringUtils.contains(flay.getRelease(), release);
  }

  private boolean likeSearch(Flay flay, FlayCondition flayCondition) {
    return StringUtils.isBlank(flayCondition.getSearch())
        || likeStudio(flay, flayCondition.getSearch())
        || likeOpus(flay, flayCondition.getSearch())
        || likeTitle(flay, flayCondition.getSearch())
        || likeActress(flay, flayCondition.getSearch())
        || likeRelease(flay, flayCondition.getSearch());
  }

  private boolean containsRank(Flay flay, int[] ranks) {
    return ranks == null || ranks.length == 0 || ArrayUtils.contains(ranks, flay.getVideo().getRank());
  }

  private boolean containsSubtitles(Flay flay, boolean withSubtitles) {
    return !withSubtitles || flay.getFiles().get(Flay.SUBTI).size() > 0;
  }

  private boolean containsFavorite(Flay flay, FlayCondition flayCondition) {
    final boolean withFavorite = flayCondition.isWithFavorite();
    final boolean withNoFavorite = flayCondition.isWithNoFavorite();
    if (withFavorite && !withNoFavorite) {
      return flay.getActressList().stream().filter(name -> actressInfoService.get(name).isFavorite()).count() > 0;
    } else if (!withFavorite && withNoFavorite) {
      return flay.getActressList().size() == 0 || flay.getActressList().stream().filter(name -> actressInfoService.get(name).isFavorite()).count() == 0;
    } else {
      return true;
    }
  }

  private int sort(Flay f1, Flay f2, FlayCondition flayCondition) {
    switch (flayCondition.getSort()) {
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
        return NumberUtils.compare(f1.getVideo().getPlay(), f2.getVideo().getPlay());
      case RANK:
        return NumberUtils.compare(f1.getVideo().getRank(), f2.getVideo().getRank());
      case LASTACCESS:
        return NumberUtils.compare(f1.getVideo().getLastAccess(), f2.getVideo().getLastAccess());
      case LASTMODIFIED:
        return NumberUtils.compare(f1.getLastModified(), f2.getLastModified());
      case SCORE:
        scoreCalculator.calcScore(f1);
        scoreCalculator.calcScore(f2);
        return NumberUtils.compare(f1.getScore(), f2.getScore());
      case LENGTH:
        return NumberUtils.compare(f1.getLength(), f2.getLength());
      default:
        return 0;
    }
  }

}
