package jk.kamoru.flayground.info.source;

import java.io.File;
import java.util.List;

import jk.kamoru.flayground.info.InfoNotfoundException;
import jk.kamoru.flayground.info.domain.Info;

public abstract class InfoSourceAdapter<T extends Info<K>, K> implements InfoSource<T, K> {

	List<T> list;

	abstract File getInfoFile();
	
	abstract T newInstance(K key);
	
	abstract void save();

	@Override
	public List<T> list() {
		return list;
	}

	@Override
	public T get(K key) {
		for (T t : list) {
			if (t.getKey().equals(key)) {
				return t;
			}
		}
		throw new InfoNotfoundException(key);
	}

	@Override
	public T getOrNew(K key) {
		try {
			return get(key);
		} catch(InfoNotfoundException e) {
			T newInstance = newInstance(key);
			list.add(newInstance);
			save();
			return newInstance;
		}
	}

	@Override
	public T create(T create) {
		try {
			get(create.getKey());
			throw new IllegalStateException("duplicated key " + create.getKey());
		} catch(InfoNotfoundException e) {
			list.add(create);
			save();
			return create;
		}
	}

	@Override
	public void update(T update) {
		T t = get(update.getKey());
		list.remove(t);
		list.add(update);
		save();
	}

	@Override
	public void delete(T delete) {
		T t = get(delete.getKey());
		list.remove(t);
		save();
	}

}
