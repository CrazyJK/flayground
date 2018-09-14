package jk.kamoru.flayground.flay.service;

import jk.kamoru.flayground.flay.domain.Flay;

public class ScoreCalculator {

	private static final int RANK = 10;
	private static final int PLAY = 10;
	private static final int SUBTITLES = 10;
	
	public static int calc(Flay flay) {
		if (flay.getVideo().getPlay() == 0)
			return 0;
		else
			return flay.getVideo().getRank() * RANK 
					+ flay.getVideo().getPlay() * PLAY 
					+ flay.getFiles().get(Flay.SUBTI).size() * SUBTITLES;
	}

}
