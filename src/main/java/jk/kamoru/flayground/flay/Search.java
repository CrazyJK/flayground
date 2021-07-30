package jk.kamoru.flayground.flay;

import org.apache.commons.lang3.StringUtils;

import lombok.Data;

@Data
public class Search {

	String query;
	Boolean favorite;

	public <T> boolean contains(T domain) {
		if (StringUtils.isBlank(query) && favorite == null) {
			return true;
		} else if (!StringUtils.isBlank(query) && favorite == null) {
			return StringUtils.containsIgnoreCase(domain.toString(), query);
		} else if (StringUtils.isBlank(query) && favorite != null) {
			return StringUtils.containsIgnoreCase(domain.toString(), "favorite=" + favorite);
		} else if (!StringUtils.isBlank(query) && favorite != null) {
			return StringUtils.containsIgnoreCase(domain.toString(), query)
					&& StringUtils.containsIgnoreCase(domain.toString(), "favorite=" + favorite);
		}
		return false;
	}
}
