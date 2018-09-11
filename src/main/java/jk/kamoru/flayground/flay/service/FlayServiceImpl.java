package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.service.InfoService;

@Service
public class FlayServiceImpl implements FlayService {

	@Autowired FlaySource flaySource;
	@Autowired InfoService<Video, String> videoInfoService;
	@Autowired FlayActionHandler flayActionHandler;

	@Override
	public Flay get(String key) {
		return flaySource.get(key);
	}

	@Override
	public Collection<Flay> find(Search search) {
		return flaySource.list().stream().filter(f -> {
			return search.contains(f);
		}).collect(Collectors.toList());
	}

	@Override
	public Collection<Flay> findByKeyValue(String field, String value) {
		if ("studio".equalsIgnoreCase(field)) {
			return flaySource.list().stream().filter(f -> {
				return f.getStudio().equals(value);
			}).collect(Collectors.toList());
		} else if ("title".equalsIgnoreCase(field)) {
			return flaySource.list().stream().filter(f -> {
				return f.getTitle().contains(value);
			}).collect(Collectors.toList());
		} else if ("actress".equalsIgnoreCase(field)) {
			return flaySource.list().stream().filter(f -> {
				return f.getActressList().stream().anyMatch(a -> {
					return a.getName().equals(value);
				});
			}).collect(Collectors.toList());
		} else if ("release".equalsIgnoreCase(field)) {
			return flaySource.list().stream().filter(f -> {
				return f.getRelease().startsWith(value);
			}).collect(Collectors.toList());
		} else if ("rank".equalsIgnoreCase(field)) {
			return flaySource.list().stream().filter(f -> {
				return f.getVideo().getRank() == new Integer(value).intValue();
			}).collect(Collectors.toList());
		} else if ("play".equalsIgnoreCase(field)) {
			return flaySource.list().stream().filter(f -> {
				return f.getVideo().getPlay() == new Integer(value).intValue();
			}).collect(Collectors.toList());
		} else if ("comment".equalsIgnoreCase(field)) {
			return flaySource.list().stream().filter(f -> {
				return f.getVideo().getComment().contains(value);
			}).collect(Collectors.toList());
		} else if ("tag".equalsIgnoreCase(field)) {
			Integer id = Integer.parseInt(value);
			return flaySource.list().stream().filter(f -> {
				return f.getVideo().getTags().stream().anyMatch(t -> {
					return t.getId() == id;
				});
			}).collect(Collectors.toList());
		} else {
			throw new IllegalStateException("unknown field");
		}
	}

	@Override
	public void play(String opus) {
		Flay flay = flaySource.get(opus);
		flayActionHandler.play(flay);
		videoInfoService.update(flay.getVideo());
	}

	@Override
	public void edit(String opus) {
		flayActionHandler.edit(flaySource.get(opus));
	}

}
