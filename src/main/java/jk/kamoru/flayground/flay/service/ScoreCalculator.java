package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.Comparator;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.info.service.ActressInfoService;

@Component
public class ScoreCalculator {

	@Autowired FlayProperties flayProperties;

	@Autowired ActressInfoService actressInfoService;

	Comparator<Flay> scoreComparator = (f1, f2) -> NumberUtils.compare(calcScore(f1), calcScore(f2));
	Comparator<Flay> favoriteComparator = (f1, f2) -> NumberUtils.compare(calcFavorite(f1), calcFavorite(f2));
	Comparator<Flay> releaseComparator = Comparator.comparing(Flay::getRelease);
	Comparator<Flay> modifiedComparator = Comparator.comparing(Flay::getLastModified);

	public Collection<Flay> listOrderByScoreDesc(Collection<Flay> flayList) {
		return flayList.stream()
				.filter(f -> f.getFiles().get(Flay.MOVIE).size() > 0)
				.sorted(scoreComparator.reversed()
						.thenComparing(favoriteComparator.reversed()
								.thenComparing(releaseComparator.reversed()
										.thenComparing(modifiedComparator.reversed()))))
				.collect(Collectors.toList());
	}

	public String toScoreString(Flay flay) {
		return String.format("Score %s = R%s * %s + P%s * %s + s%s * %s; F%s R%s M%s", calcScore(flay),
				flay.getVideo().getRank(), flayProperties.getScore().getRankPoint(),
				flay.getVideo().getPlay(), flayProperties.getScore().getPlayPoint(),
				(flay.getFiles().get(Flay.SUBTI).size() > 0 ? 1 : 0), flayProperties.getScore().getSubtitlesPoint(),
				calcFavorite(flay), flay.getRelease(), flay.getLastModified());
	}

	public int calcScore(Flay flay) {
		return flay.getVideo().getRank() * flayProperties.getScore().getRankPoint()
				+ flay.getVideo().getPlay() * flayProperties.getScore().getPlayPoint()
				+ (flay.getFiles().get(Flay.SUBTI).size() > 0 ? 1 : 0) * flayProperties.getScore().getSubtitlesPoint();
	}

	private int calcFavorite(Flay flay) {
		return flay.getActressList().stream().mapToInt(a -> StringUtils.isNotBlank(a) && actressInfoService.get(a).isFavorite() ? 1 : 0).sum();
	}

}
