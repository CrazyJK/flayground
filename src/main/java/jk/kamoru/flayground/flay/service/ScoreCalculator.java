package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.base.advice.TrackExecutionTime;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.service.ActressInfoService;

@Component
public class ScoreCalculator {

	@Autowired FlayProperties flayProperties;

	@Autowired ActressInfoService actressInfoService;

	Collection<Flay> flayList;

	Comparator<Flay> scoreComparator = Comparator.comparing(Flay::getScore).reversed();
	Comparator<Flay> flaycountComparator = (f1, f2) -> NumberUtils.compare(countFlayByActress(f2), countFlayByActress(f1));
	Comparator<Flay> releaseComparator = Comparator.comparing(Flay::getRelease).reversed();
	Comparator<Flay> modifiedComparator = Comparator.comparing(Flay::getLastModified).reversed();

	@TrackExecutionTime(message = "flay list order by score desc", level = TrackExecutionTime.LEVEL.INFO)
	public Collection<Flay> listOrderByScoreDesc(Collection<Flay> flayList) {
		flayList.forEach(f -> calcScore(f));
		this.flayList = flayList;
		return flayList.stream()
				.filter(f -> f.getFiles().get(Flay.MOVIE).size() > 0)
				.sorted(scoreComparator.thenComparing(flaycountComparator.thenComparing(modifiedComparator.thenComparing(releaseComparator))))
				.collect(Collectors.toList());
	}

	public int calcScore(Flay flay) {
		int score = resolveRank(flay) * flayProperties.getScore().getRankPoint()
				+ flay.getVideo().getPlay() * flayProperties.getScore().getPlayPoint()
				+ (flay.getFiles().get(Flay.SUBTI).size() > 0 ? 1 : 0) * flayProperties.getScore().getSubtitlesPoint()
				+ countFavoriteActress(flay) * flayProperties.getScore().getFavoritePoint();
		flay.setScore(score);
		return score;
	}

	private int countFavoriteActress(Flay flay) {
		return flay.getActressList().stream().mapToInt(a -> StringUtils.isNotBlank(a) && actressInfoService.get(a).isFavorite() ? 1 : 0).sum();
	}

	private int resolveRank(Flay flay) {
		if (flay.getVideo().getRank() != 0) {
			return flay.getVideo().getRank();
		} else {
			// {1: 50, 2: 63, 3: 64, 4: 65, 5: 66}
			List<Integer> tags = flay.getVideo().getTags().stream().map(Tag::getId).toList();
			return tags.contains(66) ? 5 : tags.contains(65) ? 4 : tags.contains(64) ? 3 : tags.contains(63) ? 2 : tags.contains(50) ? 1 : 0;
		}
	}

	private int countFlayByActress(Flay flay) {
		int count = 0;
		for (String name : flay.getActressList()) {
			for (Flay f : flayList) {
				if (f.getActressList().contains(name)) {
					count++;
				}
			}
		}
		return count;
	}

}
