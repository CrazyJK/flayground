package jk.kamoru.flayground.flay.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.flay.domain.Flay;

@Component
public class ScoreCalculator {

	@Autowired FlayProperties flayProperties;

	private final int RANK_POINT = flayProperties.getScore().getPlayPoint();
	private final int PLAY_POINT = flayProperties.getScore().getPlayPoint();
	private final int SUBTITLES_POINT = flayProperties.getScore().getSubtitlesPoint();

	public int calc(Flay flay) {
		return flay.getVideo().getRank() * RANK_POINT
				+ flay.getVideo().getPlay() * PLAY_POINT
				+ flay.getFiles().get(Flay.SUBTI).size() * SUBTITLES_POINT;
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
