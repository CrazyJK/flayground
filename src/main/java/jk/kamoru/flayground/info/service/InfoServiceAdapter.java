package jk.kamoru.flayground.info.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.info.domain.Info;
import jk.kamoru.flayground.info.source.InfoSource;

public abstract class InfoServiceAdapter<T extends Info<K>, K> implements InfoService<T, K> {

	@Autowired InfoSource<T, K> infoSource;

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
	public List<T> find(Search search) {
		return infoSource.list().stream().filter(t -> {
			return search.contains(t);
		}).collect(Collectors.toList());
	}

	@Override
	public void create(T create) {
		infoSource.create(create);
	}
	
	@Override
	public void update(T update) {
		infoSource.update(update);
	}
	
	@Override
	public void delete(T delete) {
		infoSource.delete(delete);
	}

}
