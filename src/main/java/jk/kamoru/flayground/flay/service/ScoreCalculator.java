package jk.kamoru.flayground.flay.service;

import java.util.Collection;
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

	@Autowired
	FlayProperties flayProperties;

	@Autowired
	ActressInfoService actressInfoService;

	private int calcScore(Flay flay) {
		return flay.getVideo().getRank() * flayProperties.getScore().getRankPoint()
				+ flay.getVideo().getPlay() * flayProperties.getScore().getPlayPoint()
				+ (flay.getFiles().get(Flay.SUBTI).size() > 0 ? 1 : 0) * flayProperties.getScore().getSubtitlesPoint();
	}

	// 배우의 favorite 갯수
	private int calcFavorite(Flay flay) {
		return flay.getActressList().stream().mapToInt(a -> actressInfoService.get(a).isFavorite() ? 1 : 0).sum();
	}

	private int compare(Flay flay1, Flay flay2) {
		int scoreCompared = NumberUtils.compare(calcScore(flay1), calcScore(flay2));
		if (scoreCompared != 0) {
			return scoreCompared;
		} else {
			int favoriteCompared = NumberUtils.compare(calcFavorite(flay1), calcFavorite(flay2));
			if (favoriteCompared != 0) {
				return favoriteCompared;
			} else {
				int releaseCompared = StringUtils.compare(flay1.getRelease(), flay2.getRelease());
				if (releaseCompared != 0) {
					return releaseCompared;
				} else {
					return NumberUtils.compare(flay1.getLastModified(), flay2.getLastModified());
				}
			}
		}
	}

	public Collection<Flay> orderbyScoreDesc(Collection<Flay> flayList) {
		return flayList.stream().filter(f -> f.getFiles().get(Flay.MOVIE).size() > 0)
				.sorted((f1, f2) -> compare(f2, f1)) // reverse order
				.collect(Collectors.toList());
	}

	public Object toScoreString(Flay flay) {
		return String.format("Score %s = R%s * %s + P%s * %s + s%s * %s F%s R%s M%s", calcScore(flay),
				flay.getVideo().getRank(), flayProperties.getScore().getRankPoint(), flay.getVideo().getPlay(),
				flayProperties.getScore().getPlayPoint(), (flay.getFiles().get(Flay.SUBTI).size() > 0 ? 1 : 0),
				flayProperties.getScore().getSubtitlesPoint(), calcFavorite(flay), flay.getRelease(),
				flay.getLastModified());
	}
}
