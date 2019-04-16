package jk.kamoru.flayground.flay.service;

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
		int s1 = calc(flay1);
		int s2 = calc(flay2);
		if (s1 == s2) {
            return 0;
        }
        return s1 < s2 ? -1 : 1;
	}
}
