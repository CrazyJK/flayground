package jk.kamoru.flayground.flay.service;

import org.apache.commons.lang3.BooleanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.source.FlaySource;

@Service
public class BatchService {

	public static enum Option {
		/** moveWatchedVideo */ W, /** deleteLowerRankVideo */ R, /** deleteLowerScoreVideo */ S;
	}
	
	public static enum Operation {
		/** moveWatchedVideo */ W, /** deleteLowerRankVideo */ R, /** deleteLowerScoreVideo */ S,
		/** InstanceVideoSource */ I, /** ArchiveVideoSource */ A, 
		/** Backup */ B, /** deleteEmptyFolder */ D;
	}
	
	@Autowired FlaySource flaySource;
		
	@Value("${batch.watch.move}") Boolean moveWatched;
	@Value("${batch.rank.delete}") Boolean deleteLowerRank;
	@Value("${batch.score.delete}") Boolean deleteLowerScore;
	
	public Boolean getOption(Option type) {
		switch (type) {
		case W:
			return moveWatched;
		case R:
			return deleteLowerRank;
		case S:
			return deleteLowerScore;
		default:
			throw new IllegalArgumentException("unknown batch option");
		}
	}

	public Boolean toggleOption(Option type) {
		switch (type) {
		case W:
			return moveWatched = BooleanUtils.negate(moveWatched);
		case R:
			return deleteLowerRank = BooleanUtils.negate(deleteLowerRank);
		case S:
			return deleteLowerScore = BooleanUtils.negate(deleteLowerScore);
		default:
			throw new IllegalArgumentException("unknown batch option");
		}
	}

	public void startBatch(Operation oper) {
		switch (oper) {
		case W:
			moveWatched();
			break;
		case R:
			deleteLowerRank();
			break;
		case S:
			deleteLowerRank();
			break;
		case I:
			instanceSource();
			break;
		case A: // ArchiveVideoSource
			break;
		case B: 
			backup();
			break;
		case D:
			deleteEmptyFolder();
			break;
		default:
			throw new IllegalArgumentException("unknown batch operation");
		}
		
	}

	private void deleteEmptyFolder() {
		// TODO Auto-generated method stub
		
	}

	private void backup() {
		// TODO Auto-generated method stub
		
	}

	private void instanceSource() {
		// TODO Auto-generated method stub
		
	}

	private void deleteLowerRank() {
		// TODO Auto-generated method stub
		
	}

	private void moveWatched() {
		// TODO Auto-generated method stub
		
	}

	public void reload() {
		flaySource.load();
	}

}
