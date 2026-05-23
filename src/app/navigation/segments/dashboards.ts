import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_DASHBOARDS = "/dashboards";

const path = (root: string, item: string) => `${root}${item}`;

export const dashboards: NavigationTree = {
  ...baseNavigationObj["dashboards"],
  type: "root",
  childs: [
    {
      id: "dashboards.home",
      path: path(ROOT_DASHBOARDS, "/home"),
      type: "item",
      title: "Home",
      transKey: "nav.dashboards.home",
      icon: "dashboards.home",
    },
    {
      id: "dashboards.users",
      path: path(ROOT_DASHBOARDS, "/users"),
      type: "item",
      title: "Users",
      transKey: "nav.dashboards.users",
      icon: "users",
    },
    {
      id: "dashboards.logs",
      path: path(ROOT_DASHBOARDS, "/logs"),
      type: "item",
      title: "Logs",
      transKey: "nav.dashboards.logs",
      icon: "list",
    },
    {
      id: "dashboards.categories",
      path: path(ROOT_DASHBOARDS, "/categories"),
      type: "item",
      title: "Categories",
      transKey: "nav.dashboards.categories",
      icon: "list",
    },
    {
      id: "dashboards.brands",
      path: path(ROOT_DASHBOARDS, "/brands"),
      type: "item",
      title: "Brands",
      transKey: "nav.dashboards.brands",
      icon: "list",
    },
    {
      id: "dashboards.attributes",
      path: path(ROOT_DASHBOARDS, "/attributes"),
      type: "item",
      title: "Attributes",
      transKey: "nav.dashboards.attributes",
      icon: "list",
    },
    {
      id: "dashboards.collections",
      path: path(ROOT_DASHBOARDS, "/collections"),
      type: "item",
      title: "Collections",
      transKey: "nav.dashboards.collections",
      icon: "list",
    },
    {
      id: "dashboards.tags",
      path: path(ROOT_DASHBOARDS, "/tags"),
      type: "item",
      title: "Tags",
      transKey: "nav.dashboards.tags",
      icon: "list",
    },
    {
      id: "dashboards.products",
      path: path(ROOT_DASHBOARDS, "/products"),
      type: "item",
      title: "Products",
      transKey: "nav.dashboards.products",
      icon: "list",
    },
  ],
};
