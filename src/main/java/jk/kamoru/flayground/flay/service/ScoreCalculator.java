package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.stream.Collectors;

import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.flay.domain.Flay;

@Component
public class ScoreCalculator {

	@Autowired FlayProperties flayProperties;

	public int calc(Flay flay) {
		return flay.getVideo().getRank() * flayProperties.getScore().getRankPoint()
				+ flay.getVideo().getPlay() * flayProperties.getScore().getPlayPoint()
				+ (flay.getFiles().get(Flay.SUBTI).size() > 0 ? 1 : 0) * flayProperties.getScore().getSubtitlesPoint();
	}

	public int compare(Flay flay1, Flay flay2) {
		return NumberUtils.compare(calc(flay1), calc(flay2));
	}

	public Collection<Flay> orderbyScoreDesc(Collection<Flay> flayList) {
		return flayList.stream()
				.filter(f -> f.getFiles().get(Flay.MOVIE).size() > 0 && f.getVideo().getRank() > 0)
				.sorted((f1, f2) -> compare(f2, f1)) // reverse order
				.collect(Collectors.toList());
	}

	public Object toScoreString(Flay flay) {
		return String.format("Score %s = R%s * %s + P%s * %s + s%s * %s", calc(flay),
				flay.getVideo().getRank(), flayProperties.getScore().getRankPoint(),
				flay.getVideo().getPlay(), flayProperties.getScore().getPlayPoint(),
				(flay.getFiles().get(Flay.SUBTI).size() > 0 ? 1 : 0), flayProperties.getScore().getSubtitlesPoint());
	}
}
