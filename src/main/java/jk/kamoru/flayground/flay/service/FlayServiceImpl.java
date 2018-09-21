package jk.kamoru.flayground.flay.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlayFactory;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.info.domain.History;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.service.HistoryService;
import jk.kamoru.flayground.info.service.InfoService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FlayServiceImpl implements FlayService {

	@Autowired FlaySource instanceFlaySource;
	@Autowired InfoService<Video, String> videoInfoService;
	@Autowired FlayActionHandler flayActionHandler;
	@Autowired HistoryService historyService;
	@Autowired CandidatesProvider candidatesProvider;
	@Autowired FlayFactory flayFactory;

	@Override
	public Flay get(String key) {
		return instanceFlaySource.get(key);
	}

	@Override
	public Collection<Flay> list() {
		return instanceFlaySource.list();
	}
	
	@Override
	public Collection<Flay> find(Search search) {
		return instanceFlaySource.list().stream().filter(f -> {
			return search.contains(f);
		}).collect(Collectors.toList());
	}

	@Override
	public Collection<Flay> find(String query) {
		return instanceFlaySource.list()
				.stream()
				.filter(f -> f.getFullname().contains(query))
				.sorted((f1, f2) -> StringUtils.compare(f2.getRelease(), f1.getRelease()))
				.collect(Collectors.toList());
	}

	@Override
	public Collection<Flay> findByKeyValue(String field, String value) {
		if ("studio".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getStudio().equals(value)).collect(Collectors.toList());
		} else if ("title".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getTitle().contains(value)).collect(Collectors.toList());
		} else if ("actress".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getActressList().stream().anyMatch(a -> a.equals(value))).collect(Collectors.toList());
		} else if ("release".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getRelease().startsWith(value)).collect(Collectors.toList());
		} else if ("rank".equalsIgnoreCase(field)) {
			int rank = Integer.parseInt(value);
			return instanceFlaySource.list().stream().filter(f -> f.getVideo().getRank() == rank).collect(Collectors.toList());
		} else if ("play".equalsIgnoreCase(field)) {
			int play = Integer.parseInt(value);
			return instanceFlaySource.list().stream().filter(f -> f.getVideo().getPlay() == play).collect(Collectors.toList());
		} else if ("comment".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getVideo().getComment().contains(value)).collect(Collectors.toList());
		} else if ("tag".equalsIgnoreCase(field)) {
			int id = Integer.parseInt(value);
			return instanceFlaySource.list().stream().filter(f -> f.getVideo().getTags().stream().anyMatch(t -> t.intValue() == id)).collect(Collectors.toList());
		} else {
			throw new IllegalStateException("unknown field");
		}
	}

	@Override
	public Collection<Flay> findCandidates() {
		Collection<Flay> candidates = new ArrayList<>();
		candidatesProvider.initiate();
		for (Flay flay : instanceFlaySource.list()) {
			flay.getFiles().get(Flay.CANDI).clear();
			if (candidatesProvider.findAndFill(flay)) {
				candidates.add(flay);
			}
		}
		return candidates;
	}
	
	@Override
	public boolean acceptCandidates(String opus) {
		Flay flay = instanceFlaySource.get(opus);
		return candidatesProvider.accept(flay);
	}
	
	@Override
	public void play(String opus) {
		Flay flay = instanceFlaySource.get(opus);
		flayActionHandler.play(flay);
		videoInfoService.update(flay.getVideo());
		historyService.save(History.Action.PLAY, flay);
	}

	@Override
	public void edit(String opus) {
		flayActionHandler.edit(instanceFlaySource.get(opus));
	}

	@Override
	public void rename(String opus, Flay newFlay) {
		log.info("rename {}, {}", opus, newFlay.getFullname());
		if (!opus.equals(newFlay.getOpus())) {
			throw new IllegalArgumentException("Not allowed to change opus");
		}
		Flay flay = instanceFlaySource.get(opus);
		FlayFileHandler.rename(flay, newFlay.getStudio(), newFlay.getTitle(), newFlay.getActressList(), newFlay.getRelease());
	}

}
