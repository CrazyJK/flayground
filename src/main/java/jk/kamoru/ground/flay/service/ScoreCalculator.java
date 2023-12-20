package jk.kamoru.ground.flay.service;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.info.domain.Actress;
import jk.kamoru.ground.info.domain.Tag;
import jk.kamoru.ground.info.source.InfoSource;

@Component
public class ScoreCalculator {

  @Autowired
  GroundProperties properties;

  @Autowired
  InfoSource<Actress, String> actressInfoSource;

  Comparator<Flay> likeComparator = Comparator.comparing(Flay::getLikeCount);
  Comparator<Flay> scoreComparator = Comparator.comparing(Flay::getScore);
  Comparator<Flay> studioPointComparator = Comparator.comparing(Flay::getStudioPoint);
  Comparator<Flay> actressPointComparator = Comparator.comparing(Flay::getActressPoint);
  Comparator<Flay> modifiedComparator = Comparator.comparing(Flay::getLastModified);
  Comparator<Flay> releaseComparator = Comparator.comparing(Flay::getRelease);

  Map<String, AtomicInteger> studioCountMap = new HashMap<>();

  public Collection<Flay> listOrderByScoreDesc(Collection<Flay> flayList) {
    // rank 0 제외, 비디오가 없는 것 제외
    List<Flay> filteredList = flayList.stream().filter(flay -> flay.getVideo().getRank() > 0 && flay.getFiles().get(Flay.MOVIE).size() > 0).toList();

    filteredList.forEach(f -> {
      if (studioCountMap.containsKey(f.getStudio())) {
        studioCountMap.get(f.getStudio()).incrementAndGet();
      } else {
        studioCountMap.put(f.getStudio(), new AtomicInteger(1));
      }
    });

    filteredList.forEach(f -> {
      calcScore(f);
      setActressPoint(f, filteredList);
      f.setStudioPoint(studioCountMap.get(f.getStudio()).intValue());
    });

    return filteredList.stream()
        .sorted(
          likeComparator.reversed().thenComparing(
            scoreComparator.reversed().thenComparing(
              studioPointComparator.reversed().thenComparing(
                actressPointComparator.reversed().thenComparing(
                  modifiedComparator.reversed().thenComparing(
                    releaseComparator.reversed())))))).toList();
  }

  public void calcScore(Flay flay) {
    flay.setScore(
        resolveLikes(flay) * properties.getScore().getLikePoint() +
        resolveRank(flay) * properties.getScore().getRankPoint() +
        // + flay.getVideo().getPlay() * properties.getScore().getPlayPoint()
        existingCountOfSubtitle(flay) * properties.getScore().getSubtitlesPoint() +
        countFavoriteActress(flay) * properties.getScore().getFavoritePoint());
  }

  private int resolveLikes(Flay flay) {
    return flay.getVideo().getLikes() == null ? 0 : flay.getVideo().getLikes().size();
  }

  /**
   * flay의 rank. rank == 0 이면, tag에서 찾는다
   *
   * @param flay
   * @return
   */
  private int resolveRank(Flay flay) {
    if (flay.getVideo().getRank() != 0) {
      return flay.getVideo().getRank();
    } else {
      // {1: 50, 2: 63, 3: 64, 4: 65, 5: 66}
      List<Integer> tags = flay.getVideo().getTags().stream().map(Tag::getId).toList();
      return tags.contains(66) ? 5 : tags.contains(65) ? 4 : tags.contains(64) ? 3 : tags.contains(63) ? 2 : tags.contains(50) ? 1 : 0;
    }
  }

  /**
   * 자막이 있으면 1, 없으면 0
   *
   * @param flay
   * @return
   */
  private int existingCountOfSubtitle(Flay flay) {
    return flay.getFiles().get(Flay.SUBTI).size() > 0 ? 1 : 0;
  }

  /**
   * flay의 배우들의 favorite 갯수
   *
   * @param flay
   * @return
   */
  private int countFavoriteActress(Flay flay) {
    return flay.getActressList().stream().mapToInt(a -> StringUtils.isNotBlank(a) && actressInfoSource.get(a).isFavorite() ? 1 : 0).sum();
  }

  // 출연배우의 작품 함계
  private void setActressPoint(Flay flay, Collection<Flay> flayList) {
    int count = 0;
    for (String name : flay.getActressList()) {
      for (Flay f : flayList) {
        if (f.getActressList().contains(name)) {
          count++;
        }
      }
    }
    flay.setActressPoint(count);
  }

}
