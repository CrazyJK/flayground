package jk.kamoru.flayground.flay.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.InfoNotfoundException;
import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.domain.info.Actress;
import jk.kamoru.flayground.flay.domain.info.Tag;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.flay.source.info.TagInfoSource;

@Service
public class FlayServiceImpl implements FlayService {

	@Autowired FlaySource flaySource;
	@Autowired TagInfoSource tagInfoSource;
	
	@Override
	public Collection<Flay> getFlayList(Search search) {
		return flaySource.getList().stream().filter(f -> {
			return search.contains(f);
		}).collect(Collectors.toList());
	}

	@Override
	public Flay getFlay(String key) {
		return flaySource.get(key);
	}

	@Override
	public Collection<Actress> getActressList(Search search) {
		List<Actress> list = new ArrayList<>();
		for (Flay flay : flaySource.getList()) {
			for (Actress actress : flay.getActressList()) {
				if (!list.contains(actress)) {
					list.add(actress);
				}
			}
		}
		return list;
	}

	@Override
	public Actress getActress(String name) {
		for (Flay flay : flaySource.getList()) {
			for (Actress actress : flay.getActressList()) {
				if (actress.getName().equalsIgnoreCase(name)) {
					return actress;
				}
			}
		}
		throw new InfoNotfoundException(name);
	}

	@Override
	public Collection<Tag> getTagList() {
		return tagInfoSource.getList();
	}

	@Override
	public Tag getTag(String name) {
		return tagInfoSource.get(name);
	}

	@Override
	public Collection<Flay> findFlayByKeyValue(String key, String value) {
		if ("studio".equalsIgnoreCase(key)) {
			return flaySource.getList().stream().filter(f -> {
				return f.getStudio().equals(value);
			}).collect(Collectors.toList());
		} else if ("title".equalsIgnoreCase(key)) {
			return flaySource.getList().stream().filter(f -> {
				return f.getTitle().contains(value);
			}).collect(Collectors.toList());
		} else if ("actress".equalsIgnoreCase(key)) {
			return flaySource.getList().stream().filter(f -> {
				return f.getActressList().stream().anyMatch(a -> {
					return a.getName().equals(value);
				});
			}).collect(Collectors.toList());
		} else if ("release".equalsIgnoreCase(key)) {
			return flaySource.getList().stream().filter(f -> {
				return f.getRelease().startsWith(value);
			}).collect(Collectors.toList());
		} else if ("rank".equalsIgnoreCase(key)) {
			return flaySource.getList().stream().filter(f -> {
				return f.getVideo().getRank().equals(new Integer(value));
			}).collect(Collectors.toList());
		} else if ("play".equalsIgnoreCase(key)) {
			return flaySource.getList().stream().filter(f -> {
				return f.getVideo().getPlay().equals(new Integer(value));
			}).collect(Collectors.toList());
		} else if ("comment".equalsIgnoreCase(key)) {
			return flaySource.getList().stream().filter(f -> {
				return f.getVideo().getComment().contains(value);
			}).collect(Collectors.toList());
		} else if ("tag".equalsIgnoreCase(key)) {
			return flaySource.getList().stream().filter(f -> {
				return f.getVideo().getTags().stream().anyMatch(t -> {
					return t.getName().contains(value) || t.getDescription().contains(value);
				});
			}).collect(Collectors.toList());
		} else {
			throw new IllegalStateException("unknown key");
		}
	}

}