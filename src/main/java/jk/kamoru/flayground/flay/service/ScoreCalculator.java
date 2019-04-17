package jk.kamoru.flayground.flay.service;

import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.flay.domain.Flay;

@Component
public class ScoreCalculator {

	@Autowired FlayProperties flayProperties;

	public int calc(Flay flay) {
		return flay.getVideo().getRank() * flayProperties.getScore().getPlayPoint()
				+ flay.getVideo().getPlay() * flayProperties.getScore().getPlayPoint()
				+ flay.getFiles().get(Flay.SUBTI).size() * flayProperties.getScore().getSubtitlesPoint();
	}

	public int compare(Flay flay1, Flay flay2) {
		return NumberUtils.compare(calc(flay1), calc(flay2));
	}
}
