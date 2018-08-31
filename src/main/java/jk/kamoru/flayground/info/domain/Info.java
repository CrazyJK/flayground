package jk.kamoru.flayground.info.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;

public interface Info<K> {

	@JsonIgnore K getKey();
	
	@JsonIgnore void setKey(K key);

}
