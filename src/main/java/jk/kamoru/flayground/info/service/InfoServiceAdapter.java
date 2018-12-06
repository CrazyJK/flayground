package jk.kamoru.flayground.info.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;

import jk.kamoru.flayground.info.domain.Info;
import jk.kamoru.flayground.info.source.InfoSource;
import jk.kamoru.flayground.web.socket.notice.AnnounceService;

public abstract class InfoServiceAdapter<T extends Info<K>, K> implements InfoService<T, K> {

	@Autowired InfoSource<T, K> infoSource;
	@Autowired AnnounceService notificationService;

	@Override
	public T get(K key) {
		return infoSource.get(key);
	}

	@Override
	public T getOrNew(K key) {
		return infoSource.getOrNew(key);
	}

	@Override
	public List<T> list() {
		return infoSource.list();
	}

	@Override
	public List<T> find(String query) {
		return infoSource.list().stream().filter(t -> {
			return t.toString().contains(query);
		}).collect(Collectors.toList());
	}

	@Override
	public T create(T create) {
		T created = infoSource.create(create);
		notificationService.announce("Created", created.toString());
		return created;
	}
	
	@Override
	public void update(T update) {
		infoSource.update(update);
		notificationService.announce("Updated", update.toString());
	}
	
	@Override
	public void delete(T delete) {
		infoSource.delete(delete);
		notificationService.announce("Deleted", delete.toString());
	}

}
